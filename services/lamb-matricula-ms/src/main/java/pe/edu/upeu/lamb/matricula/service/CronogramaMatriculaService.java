package pe.edu.upeu.lamb.matricula.service;

import pe.edu.upeu.lamb.matricula.dto.CronogramaMatriculaRequest;
import pe.edu.upeu.lamb.matricula.dto.CronogramaMatriculaResponse;
import pe.edu.upeu.lamb.matricula.entity.CronogramaMatricula;
import pe.edu.upeu.lamb.matricula.exception.BusinessRuleException;
import pe.edu.upeu.lamb.matricula.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.matricula.mapper.CronogramaMatriculaMapper;
import pe.edu.upeu.lamb.matricula.repository.AmpliacionPlazoMatriculaRepository;
import pe.edu.upeu.lamb.matricula.repository.VariacionMatriculaRepository;
import pe.edu.upeu.lamb.matricula.repository.CronogramaMatriculaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CronogramaMatriculaService {

    private final CronogramaMatriculaRepository cronogramaMatriculaRepository;
    private final AmpliacionPlazoMatriculaRepository ampliacionPlazoMatriculaRepository;
    private final VariacionMatriculaRepository variacionMatriculaRepository;
    private final CronogramaMatriculaMapper cronogramaMatriculaMapper;

    public List<CronogramaMatriculaResponse> listar() {
        return cronogramaMatriculaRepository.findAll().stream()
                .map(cronogramaMatriculaMapper::toResponse)
                .toList();
    }

    public CronogramaMatriculaResponse obtener(Long id) {
        return cronogramaMatriculaMapper.toResponse(buscarOFallar(id));
    }

    public CronogramaMatriculaResponse crear(CronogramaMatriculaRequest request) {
        CronogramaMatricula entity = cronogramaMatriculaMapper.toEntity(request);
        return cronogramaMatriculaMapper.toResponse(cronogramaMatriculaRepository.save(entity));
    }

    @Transactional
    public CronogramaMatriculaResponse actualizar(Long id, CronogramaMatriculaRequest request) {
        CronogramaMatricula entity = buscarOFallar(id);
        entity.setPeriodo(request.getPeriodo());
        entity.setFechaInicio(request.getFechaInicio());
        entity.setFechaFin(request.getFechaFin());
        entity.setDescripcion(request.getDescripcion());
        return cronogramaMatriculaMapper.toResponse(cronogramaMatriculaRepository.save(entity));
    }

    @Transactional
    public void eliminar(Long id) {
        if (variacionMatriculaRepository.existsByIdCronograma(id) || ampliacionPlazoMatriculaRepository.existsByIdCronograma(id)) {
            throw new BusinessRuleException("No se puede eliminar el cronograma " + id
                    + ": tiene variaciones o ampliaciones de plazo. Eliminalas primero.");
        }
        cronogramaMatriculaRepository.delete(buscarOFallar(id));
    }

    private CronogramaMatricula buscarOFallar(Long id) {
        return cronogramaMatriculaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cronograma de matricula no encontrado: " + id));
    }
}
